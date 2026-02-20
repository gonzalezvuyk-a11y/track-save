import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, PiggyBank, TrendingDown } from 'lucide-react';
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
import { formatNumberWithDots, parseNumberFromDots } from '../lib/finance';

type MonthlyGoal = {
  id: string;
  month: string;
  savingsTarget: number;
  variableSpendingLimit: number;
  minimumDebtPayment: number;
};

export function GoalModal({
  isOpen,
  onClose,
  onSave,
  goal,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (g: Omit<MonthlyGoal, 'id' | 'month'>) => void;
  goal: MonthlyGoal | null;
  currency: string;
}) {
  const [formData, setFormData] = useState({
    savingsTarget: 0,
    variableSpendingLimit: 0,
    minimumDebtPayment: 0,
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        savingsTarget: goal.savingsTarget,
        variableSpendingLimit: goal.variableSpendingLimit,
        minimumDebtPayment: goal.minimumDebtPayment,
      });
    } else {
      setFormData({
        savingsTarget: 0,
        variableSpendingLimit: 0,
        minimumDebtPayment: 0,
      });
    }
  }, [goal, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      MXN: '$',
      ARS: '$',
      COP: '$',
      CLP: '$',
      PEN: 'S/',
      PYG: '₲',
      GBP: '£',
    };
    return symbols[curr] || '$';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Plan del Mes</DialogTitle>
          <DialogDescription>Configurá tus 3 metas principales para el mes</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-violet-600" />
              Meta de ahorro ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.savingsTarget)}
              onChange={(e) =>
                setFormData({ ...formData, savingsTarget: parseNumberFromDots(e.target.value) })
              }
              placeholder="¿Cuánto querés ahorrar este mes?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Tope de gastos variables ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.variableSpendingLimit)}
              onChange={(e) =>
                setFormData({ ...formData, variableSpendingLimit: parseNumberFromDots(e.target.value) })
              }
              placeholder="Límite para gastos no esenciales"
            />
            <p className="text-xs text-neutral-500">
              Gastos como restaurantes, entretenimiento, compras, etc.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-600" />
              Pago mínimo de deudas ({getCurrencySymbol(currency)})
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatNumberWithDots(formData.minimumDebtPayment)}
              onChange={(e) =>
                setFormData({ ...formData, minimumDebtPayment: parseNumberFromDots(e.target.value) })
              }
              placeholder="Monto mínimo a pagar en deudas"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            💡 <strong>Tip:</strong> Estas metas te ayudan a tener un plan claro cada mes.
            Revisalas y ajustalas según tus ingresos y prioridades.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
