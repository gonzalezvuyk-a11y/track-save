import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Calendar, TrendingDown, TrendingUp, Zap } from 'lucide-react';
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
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatNumberWithDots, getDefaultDateForMonth, parseNumberFromDots } from '../lib/finance';

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Income' | 'Expense';
  account: 'Cash' | 'Bank' | 'Card';
  amount: number;
  tags?: string[];
  notes?: string;
};

type Category = {
  name: string;
};

export function QuickAddModal({
  isOpen,
  onClose,
  onSave,
  categories,
  selectedMonth,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  selectedMonth: string;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error('Monto y categoría son requeridos');
      return;
    }

    onSave({
      date: getDefaultDateForMonth(selectedMonth),
      description: category,
      category,
      type,
      account: 'Cash',
      amount: parseNumberFromDots(amount),
      tags: [],
      notes: '',
    });

    setAmount('');
    setCategory('');
    setType('Expense');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory('');
      setType('Expense');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <DialogTitle>Quick Add</DialogTitle>
          </div>
          <DialogDescription>Agregar movimiento rápido en el mes seleccionado</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {new Date(getDefaultDateForMonth(selectedMonth)).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === 'Expense' ? 'default' : 'outline'}
              className={type === 'Expense' ? 'bg-rose-600 hover:bg-rose-700' : ''}
              onClick={() => setType('Expense')}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'Income' ? 'default' : 'outline'}
              className={type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => setType('Income')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Ingreso
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-amount">Monto</Label>
            <Input
              id="quick-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNumberWithDots(parseNumberFromDots(e.target.value)))}
              placeholder="0.00"
              autoFocus
              className="text-2xl font-semibold h-14"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="quick-category">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => (type === 'Expense' ? true : cat.name === 'Salario' || cat.name === 'Freelance'))
                  .map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
