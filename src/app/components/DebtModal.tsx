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
import { formatNumberWithDots, parseNumberFromDots } from '../lib/finance';

type Debt = {
  id: string;
  name: string;
  balance: number;
  apr?: number;
  monthlyPayment: number;
  dueDay: number;
};

export function DebtModal({
  isOpen,
  onClose,
  onSave,
  debt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: Omit<Debt, 'id'>) => void;
  debt: Debt | null;
}) {
  const [formData, setFormData] = useState<Omit<Debt, 'id'>>({
    name: '',
    balance: 0,
    apr: undefined,
    monthlyPayment: 0,
    dueDay: 1,
  });

  useEffect(() => {
    if (debt) {
      setFormData(debt);
    } else {
      setFormData({
        name: '',
        balance: 0,
        apr: undefined,
        monthlyPayment: 0,
        dueDay: 1,
      });
    }
  }, [debt, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{debt ? 'Editar deuda' : 'Agregar deuda'}</DialogTitle>
          <DialogDescription>Registra los detalles de tu deuda</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-name">Nombre</Label>
            <Input
              id="debt-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-balance">Balance total</Label>
              <Input
                id="debt-balance"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.balance)}
                onChange={(e) => setFormData({ ...formData, balance: parseNumberFromDots(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-apr">APR % (opcional)</Label>
              <Input
                id="debt-apr"
                type="number"
                step="0.01"
                min="0"
                value={formData.apr || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    apr: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-payment">Pago mensual</Label>
              <Input
                id="debt-payment"
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(formData.monthlyPayment)}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyPayment: parseNumberFromDots(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-due">Día de vencimiento</Label>
              <Input
                id="debt-due"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => {
                  const parsedDay = Number.parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    dueDay: Number.isNaN(parsedDay) ? 1 : parsedDay,
                  });
                }}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{debt ? 'Actualizar' : 'Agregar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
