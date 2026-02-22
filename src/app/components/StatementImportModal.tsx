import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { getDefaultDateForMonth } from '../lib/finance';

type CategoryRule = {
  keyword: string;
  category: string;
};

type ImportTransaction = {
  date: string;
  description: string;
  category: string;
  type: 'Income' | 'Expense';
  account: string;
  amount: number;
  tags?: string[];
  notes?: string;
};

type PreviewRow = ImportTransaction & {
  rowNumber: number;
};

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const detectDelimiter = (headerLine: string) => {
  const candidates = [',', ';', '\t'];
  const scored = candidates.map((delimiter) => ({
    delimiter,
    count: headerLine.split(delimiter).length,
  }));
  return scored.sort((a, b) => b.count - a.count)[0]?.delimiter || ',';
};

const parseAmount = (rawValue: string) => {
  const sanitized = rawValue.replace(/[^\d,.-]/g, '').trim();
  if (!sanitized) {
    return null;
  }

  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');

  if (hasComma && hasDot) {
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';

    const normalized = sanitized
      .split(thousandsSeparator)
      .join('')
      .replace(decimalSeparator, '.');

    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (hasComma && !hasDot) {
    const normalized = sanitized.replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDate = (rawValue: string, selectedMonth: string) => {
  const value = rawValue.trim();
  if (!value) {
    return getDefaultDateForMonth(selectedMonth);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const slashMatch = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);

    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const slashWithoutYearMatch = value.match(/^(\d{1,2})[\/.-](\d{1,2})$/);
  if (slashWithoutYearMatch) {
    const [defaultYear] = selectedMonth.split('-');
    const day = Number(slashWithoutYearMatch[1]);
    const month = Number(slashWithoutYearMatch[2]);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${defaultYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return getDefaultDateForMonth(selectedMonth);
};

const inferTypeFromValue = (value: string): 'Income' | 'Expense' | null => {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return null;
  }

  if (['income', 'ingreso', 'credito', 'credit', 'abono', 'deposito'].some((token) => normalized.includes(token))) {
    return 'Income';
  }

  if (['expense', 'egreso', 'debito', 'debit', 'cargo', 'compra', 'pago'].some((token) => normalized.includes(token))) {
    return 'Expense';
  }

  return null;
};

const inferCategory = (
  description: string,
  type: 'Income' | 'Expense',
  categoryRules: CategoryRule[],
  categories: string[],
) => {
  const normalizedDescription = description.toLowerCase();

  const matchedRule = categoryRules.find((rule) =>
    normalizedDescription.includes(rule.keyword.toLowerCase()),
  );

  if (matchedRule) {
    return matchedRule.category;
  }

  if (type === 'Income') {
    if (/salari|sueldo|nomina|payroll|salary/i.test(description)) {
      return categories.includes('Salario') ? 'Salario' : 'Otros Ingresos';
    }

    if (/freelance|honorario|transferencia recibida/i.test(description)) {
      return categories.includes('Freelance') ? 'Freelance' : 'Otros Ingresos';
    }

    return 'Otros Ingresos';
  }

  if (/super|market|almacen|minimarket/i.test(description)) {
    return categories.includes('Supermercado') ? 'Supermercado' : 'Otros Gastos';
  }
  if (/uber|bolt|cabify|taxi|bus|colectivo|transporte/i.test(description)) {
    return categories.includes('Transporte (Bolt/Uber)') ? 'Transporte (Bolt/Uber)' : 'Otros Gastos';
  }
  if (/netflix|spotify|youtube|prime|disney|suscrip/i.test(description)) {
    return categories.includes('Suscripciones') ? 'Suscripciones' : 'Otros Gastos';
  }
  if (/farmacia|salud|medic/i.test(description)) {
    return categories.includes('Salud') ? 'Salud' : 'Otros Gastos';
  }
  if (/restaurant|comida|delivery|pedido|mcdonald|burger|pizza/i.test(description)) {
    return categories.includes('Restaurantes') ? 'Restaurantes' : 'Otros Gastos';
  }

  return 'Otros Gastos';
};

const extractRowsFromCsvContent = ({
  content,
  selectedMonth,
  categoryRules,
  categories,
  accounts,
}: {
  content: string;
  selectedMonth: string;
  categoryRules: CategoryRule[];
  categories: string[];
  accounts: string[];
}) => {
  const nonEmptyLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (nonEmptyLines.length < 2) {
    return {
      importedRows: [] as PreviewRow[],
      skippedRows: 0,
      errorMessage: 'El archivo no tiene datos suficientes para importar',
    };
  }

  const delimiter = detectDelimiter(nonEmptyLines[0]);
  const headerValues = parseCsvLine(nonEmptyLines[0], delimiter);
  const normalizedHeaders = headerValues.map(normalizeKey);

  const findIndex = (candidates: string[]) =>
    normalizedHeaders.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));

  const dateIndex = findIndex(['date', 'fecha', 'fechamovimiento', 'fechaoperacion']);
  const descriptionIndex = findIndex(['description', 'descripcion', 'detalle', 'concepto', 'merchant', 'comercio']);
  const categoryIndex = findIndex(['category', 'categoria', 'rubro']);
  const typeIndex = findIndex(['type', 'tipo', 'movimiento']);
  const accountIndex = findIndex(['account', 'cuenta', 'tarjeta', 'medio']);
  const amountIndex = findIndex(['amount', 'monto', 'importe', 'valor']);
  const debitIndex = findIndex(['debit', 'debito', 'cargo', 'egreso']);
  const creditIndex = findIndex(['credit', 'credito', 'abono', 'ingreso']);
  const notesIndex = findIndex(['notes', 'nota', 'observacion', 'memo']);

  if (descriptionIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
    return {
      importedRows: [] as PreviewRow[],
      skippedRows: 0,
      errorMessage: 'No se encontraron columnas mínimas (descripción y monto/débito/crédito)',
    };
  }

  const importedRows: PreviewRow[] = [];
  let skippedRows = 0;

  for (let lineIndex = 1; lineIndex < nonEmptyLines.length; lineIndex++) {
    const values = parseCsvLine(nonEmptyLines[lineIndex], delimiter);
    const description = (values[descriptionIndex] || '').trim();

    if (!description) {
      skippedRows++;
      continue;
    }

    const explicitType = typeIndex >= 0 ? inferTypeFromValue(values[typeIndex] || '') : null;
    const parsedAmount = amountIndex >= 0 ? parseAmount(values[amountIndex] || '') : null;
    const debitAmount = debitIndex >= 0 ? parseAmount(values[debitIndex] || '') : null;
    const creditAmount = creditIndex >= 0 ? parseAmount(values[creditIndex] || '') : null;

    let type: 'Income' | 'Expense' | null = explicitType;
    let amount = parsedAmount;

    if (debitAmount !== null || creditAmount !== null) {
      if ((creditAmount || 0) > 0 && (!debitAmount || debitAmount <= 0)) {
        type = 'Income';
        amount = Math.abs(creditAmount || 0);
      } else if ((debitAmount || 0) > 0 && (!creditAmount || creditAmount <= 0)) {
        type = 'Expense';
        amount = Math.abs(debitAmount || 0);
      }
    }

    if (amount === null || Number.isNaN(amount) || amount === 0) {
      skippedRows++;
      continue;
    }

    if (!type) {
      type = amount >= 0 ? 'Income' : 'Expense';
    }

    const absoluteAmount = Math.abs(amount);
    const dateValue = dateIndex >= 0 ? parseDate(values[dateIndex] || '', selectedMonth) : getDefaultDateForMonth(selectedMonth);
    const explicitCategory = categoryIndex >= 0 ? (values[categoryIndex] || '').trim() : '';
    const category = explicitCategory || inferCategory(description, type, categoryRules, categories);
    const rawAccount = accountIndex >= 0 ? (values[accountIndex] || '').trim() : '';
    const account = rawAccount || (accounts.includes('Card') ? 'Card' : accounts[0] || 'Card');
    const notes = notesIndex >= 0 ? (values[notesIndex] || '').trim() : '';

    importedRows.push({
      rowNumber: lineIndex + 1,
      date: dateValue,
      description,
      category,
      type,
      account,
      amount: absoluteAmount,
      tags: [],
      notes,
    });
  }

  return {
    importedRows,
    skippedRows,
    errorMessage: null,
  };
};

const extractRowsFromPdfText = ({
  text,
  selectedMonth,
  categoryRules,
  categories,
  accounts,
}: {
  text: string;
  selectedMonth: string;
  categoryRules: CategoryRule[];
  categories: string[];
  accounts: string[];
}) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const importedRows: PreviewRow[] = [];
  let skippedRows = 0;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (
      /saldo|total|resumen|extracto|movimientos|pagina|fecha\s+descripcion/i.test(line) &&
      !/^\d{1,2}[\/.-]\d{1,2}/.test(line)
    ) {
      skippedRows++;
      continue;
    }

    const pairMatch = line.match(
      /^(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\s+(.+?)\s+(-?[\d.,]+)\s+(-?[\d.,]+)$/,
    );
    const singleAmountMatch = line.match(
      /^(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\s+(.+?)\s+(-?[\d.,]+)$/,
    );

    if (!pairMatch && !singleAmountMatch) {
      skippedRows++;
      continue;
    }

    const rowMatch = pairMatch || singleAmountMatch;
    if (!rowMatch) {
      skippedRows++;
      continue;
    }

    const dateRaw = rowMatch[1] || '';
    const description = (rowMatch[2] || '').trim();

    if (!description) {
      skippedRows++;
      continue;
    }

    let amount: number | null = null;
    let type: 'Income' | 'Expense' | null = inferTypeFromValue(description);

    if (pairMatch) {
      const debit = parseAmount(pairMatch[3] || '');
      const credit = parseAmount(pairMatch[4] || '');

      if ((credit || 0) > 0 && (!debit || debit <= 0)) {
        amount = Math.abs(credit || 0);
        type = 'Income';
      } else if ((debit || 0) > 0 && (!credit || credit <= 0)) {
        amount = Math.abs(debit || 0);
        type = 'Expense';
      }
    }

    if (amount === null && singleAmountMatch) {
      const amountToken = singleAmountMatch[3] || '';
      const parsedAmount = parseAmount(amountToken);
      if (parsedAmount !== null && !Number.isNaN(parsedAmount) && parsedAmount !== 0) {
        amount = Math.abs(parsedAmount);
        if (!type) {
          type = amountToken.includes('-') ? 'Expense' : 'Expense';
        }
      }
    }

    if (amount === null || Number.isNaN(amount) || amount === 0) {
      skippedRows++;
      continue;
    }

    if (!type) {
      type = 'Expense';
    }

    const date = parseDate(dateRaw, selectedMonth);
    const category = inferCategory(description, type, categoryRules, categories);
    const account = accounts.includes('Card') ? 'Card' : accounts[0] || 'Card';

    importedRows.push({
      rowNumber: index + 1,
      date,
      description,
      category,
      type,
      account,
      amount,
      tags: [],
      notes: 'Importado desde PDF',
    });
  }

  return {
    importedRows,
    skippedRows,
    errorMessage: importedRows.length === 0 ? 'No se detectaron movimientos válidos en el PDF' : null,
  };
};

const extractTextFromPdfFile = async (file: File) => {
  GlobalWorkerOptions.workerSrc = pdfWorker;
  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
      .trim();

    if (text) {
      pages.push(text);
    }
  }

  return pages.join('\n');
};

export function StatementImportModal({
  isOpen,
  onClose,
  onImport,
  categories,
  categoryRules,
  accounts,
  selectedMonth,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: ImportTransaction[]) => void;
  categories: string[];
  categoryRules: CategoryRule[];
  accounts: string[];
  selectedMonth: string;
}) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [skippedRows, setSkippedRows] = useState(0);

  const previewRows = useMemo(() => rows.slice(0, 12), [rows]);

  useEffect(() => {
    if (!isOpen) {
      setFileName('');
      setRows([]);
      setSkippedRows(0);
    }
  }, [isOpen]);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const result = isPdf
        ? extractRowsFromPdfText({
            text: await extractTextFromPdfFile(file),
            selectedMonth,
            categoryRules,
            categories,
            accounts,
          })
        : extractRowsFromCsvContent({
            content: await file.text(),
            selectedMonth,
            categoryRules,
            categories,
            accounts,
          });

      if (result.errorMessage) {
        toast.error(result.errorMessage);
      }

      setRows(result.importedRows);
      setSkippedRows(result.skippedRows);

      if (result.importedRows.length > 0) {
        toast.success(`Se procesaron ${result.importedRows.length} filas para importar`);
      }
      if (result.skippedRows > 0) {
        toast.info(`${result.skippedRows} filas fueron omitidas por datos incompletos`);
      }
    } catch {
      toast.error('No se pudo procesar el archivo. Probá con CSV exportado de tu banco.');
      setRows([]);
      setSkippedRows(0);
    } finally {
      event.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (rows.length === 0) {
      toast.error('No hay filas válidas para importar');
      return;
    }

    onImport(rows.map(({ rowNumber, ...transaction }) => transaction));
    onClose();
  };

  const incomeCount = rows.filter((row) => row.type === 'Income').length;
  const expenseCount = rows.length - incomeCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar extracto de tarjeta (CSV/PDF)</DialogTitle>
          <DialogDescription>
            Cargá un CSV o PDF para detectar automáticamente ingresos, egresos y categoría antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Input type="file" accept=".csv,text/csv,.pdf,application/pdf" onChange={handleFileSelected} className="max-w-[420px]" />
            {fileName ? <Badge variant="secondary">{fileName}</Badge> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {rows.length} listas para importar
            </Badge>
            <Badge variant="outline">{incomeCount} ingresos</Badge>
            <Badge variant="outline">{expenseCount} egresos</Badge>
            {skippedRows > 0 ? (
              <Badge variant="outline" className="gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {skippedRows} omitidas
              </Badge>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Seleccioná un archivo CSV o PDF para ver la previsualización.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fila</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={`${row.rowNumber}-${row.description}-${row.amount}`}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>
                        <Badge variant={row.type === 'Income' ? 'secondary' : 'outline'}>
                          {row.type === 'Income' ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.account}</TableCell>
                      <TableCell className="text-right">{row.amount.toLocaleString('es-ES')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {rows.length > 12 ? (
            <p className="text-xs text-muted-foreground">Mostrando 12 de {rows.length} filas preprocesadas.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmImport} disabled={rows.length === 0}>
            <Upload className="w-4 h-4 mr-2" />
            Importar {rows.length > 0 ? `${rows.length} movimientos` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
