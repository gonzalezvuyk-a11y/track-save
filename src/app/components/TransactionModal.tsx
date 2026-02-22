import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
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
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatNumberWithDots, getDefaultDateForMonth, parseNumberFromDots } from '../lib/finance';

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Income' | 'Expense';
  account: string;
  amount: number;
  tags?: string[];
  notes?: string;
};

type Category = {
  name: string;
};

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  selectedMonth,
  transaction,
  accounts,
  availableTags,
  onAddAccount,
  onAddTag,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  selectedMonth: string;
  transaction: Transaction | null;
  accounts: string[];
  availableTags: string[];
  onAddAccount: (account: string) => void;
  onAddTag: (tag: string) => void;
}) {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: getDefaultDateForMonth(selectedMonth),
    description: '',
    category: '',
    type: 'Expense',
    account: 'Cash',
    amount: 0,
    tags: [],
    notes: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
    } else {
      setFormData({
        date: getDefaultDateForMonth(selectedMonth),
        description: '',
        category: '',
        type: 'Expense',
        account: 'Cash',
        amount: 0,
        tags: [],
        notes: '',
      });
    }
  }, [transaction, isOpen, selectedMonth]);

  const [newTag, setNewTag] = useState('');
  const [newAccount, setNewAccount] = useState('');

  const handleAddAccountToList = () => {
    const account = newAccount.trim();
    if (!account) {
      return;
    }

    onAddAccount(account);
    setFormData({ ...formData, account });
    setNewAccount('');
  };

  const handleAddTagToTransaction = () => {
    if (newTag.trim()) {
      const tag = newTag.trim();
      if (!formData.tags?.includes(tag)) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
        onAddTag(tag);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tagToRemove) || [] });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.category.trim()) {
      toast.error('Selecciona una categoría');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar movimiento' : 'Agregar movimiento'}</DialogTitle>
          <DialogDescription>Completa los detalles de la transacción</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.amount)}
                onChange={(e) => setFormData({ ...formData, amount: parseNumberFromDots(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'Income' | 'Expense') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Ingreso</SelectItem>
                  <SelectItem value="Expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Cuenta</Label>
              <Select
                value={formData.account}
                onValueChange={(value) => setFormData({ ...formData, account: value })}
              >
                <SelectTrigger id="account">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account === 'Cash' ? 'Efectivo' : account === 'Bank' ? 'Banco' : account === 'Card' ? 'Tarjeta' : account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-2">
                <Input
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="Nueva cuenta (ej: Itaú, Ueno)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAccountToList();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddAccountToList}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ej: Trabajo, Viaje..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTagToTransaction();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTagToTransaction}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!formData.tags?.includes(tag)) {
                        setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Recibo guardado en Drive"
            />
            <p className="text-xs text-neutral-500">
              💡 Podés agregar detalles como número de factura, referencia, etc.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{transaction ? 'Actualizar' : 'Agregar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
