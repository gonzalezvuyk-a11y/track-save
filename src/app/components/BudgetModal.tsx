import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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
import { formatNumberWithDots, parseNumberFromDots } from '../lib/finance';

type Category = {
  name: string;
};

type BudgetRow = {
  id: string;
  month: string;
  category: string;
  budget: number;
  description?: string;
  installmentNumber?: number;
  installments?: number;
  paidAt?: string;
};

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  categories,
  selectedMonth,
  budget,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (b: Omit<BudgetRow, 'id'>) => void;
  categories: Category[];
  selectedMonth: string;
  budget: BudgetRow | null;
}) {
  const [formData, setFormData] = useState<Omit<BudgetRow, 'id'>>({
    month: selectedMonth,
    category: '',
    budget: 0,
    description: '',
    installmentNumber: undefined,
    installments: undefined,
    paidAt: undefined,
  });

  useEffect(() => {
    if (budget) {
      setFormData(budget);
    } else {
      setFormData({
        month: selectedMonth,
        category: '',
        budget: 0,
        description: '',
        installmentNumber: undefined,
        installments: undefined,
        paidAt: undefined,
      });
    }
  }, [budget, selectedMonth, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar presupuesto' : 'Agregar presupuesto'}</DialogTitle>
          <DialogDescription>Define el límite de gasto para una categoría</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="budget-category">
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
            <Label htmlFor="budget-amount">Presupuesto</Label>
            <Input
              id="budget-amount"
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.budget)}
              onChange={(e) => setFormData({ ...formData, budget: parseNumberFromDots(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-description">Descripción (opcional)</Label>
            <Input
              id="budget-description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Préstamo de la compu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-installment-number">Número de cuota actual (opcional)</Label>
            <Input
              id="budget-installment-number"
              type="number"
              min="1"
              value={formData.installmentNumber || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  installmentNumber: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Ej: 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-installments">Número de cuotas (opcional)</Label>
            <Input
              id="budget-installments"
              type="number"
              min="1"
              value={formData.installments || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  installments: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Ej: 12"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{budget ? 'Actualizar' : 'Agregar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
