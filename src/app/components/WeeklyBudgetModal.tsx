import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  name: string;
  group: 'Fixed' | 'Variable' | 'Savings' | 'Debt';
  essential: boolean;
}

interface WeeklyBudget {
  id: string;
  category: string;
  weeklyLimit: number;
  year: number;
  week: number;
}

// Get ISO week number
const getISOWeek = (date: Date): number => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

export function WeeklyBudgetModal({ 
  isOpen, 
  onClose, 
  onSave, 
  categories,
  currency
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSave: (wb: Omit<WeeklyBudget, 'id'>) => void;
  categories: Category[];
  currency: string;
}) {
  const [category, setCategory] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !weeklyLimit) {
      toast.error('Completa todos los campos');
      return;
    }

    const now = new Date();
    const week = getISOWeek(now);
    const year = now.getFullYear();

    onSave({
      category,
      weeklyLimit: parseFloat(weeklyLimit),
      week,
      year,
    });

    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setCategory('');
      setWeeklyLimit('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <DialogTitle>Presupuesto Semanal</DialogTitle>
          </div>
          <DialogDescription>
            Establece límites semanales para categorías específicas
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wb-category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="wb-category">
                <SelectValue placeholder="Seleccionar categoría…" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => ['Delivery', 'Transporte (Bolt/Uber)', 'Minimarket', 'Restaurantes', 'Entretenimiento'].includes(cat.name))
                  .map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wb-limit">Límite Semanal ({currency})</Label>
            <Input
              id="wb-limit"
              type="number"
              step="0.01"
              min="0"
              value={weeklyLimit}
              onChange={(e) => setWeeklyLimit(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
            <p className="text-xs text-sky-900">
              <strong>Consejo:</strong> Configura límites para categorías donde gastas más frecuentemente 
              (Delivery, Transporte, etc.) para controlar micro-gastos.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Agregar Presupuesto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
