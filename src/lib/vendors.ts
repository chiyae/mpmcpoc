import type { Vendor } from './types';

export const vendors: Vendor[] = [
  {
    id: 'VEND-001',
    name: 'MediSupplies Inc.',
    email: 'sales@medisupplies.com',
    supplies: ['PAR500', 'IBU200', 'AMO500'],
  },
  {
    id: 'VEND-002',
    name: 'Global Medical',
    email: 'orders@globalmed.com',
    supplies: ['PAR500', 'GAUZE-S', 'SYR-10ML'],
  },
  {
    id: 'VEND-003',
    name: 'PharmaDirect',
    email: 'contact@pharmadirect.co',
    supplies: ['IBU200', 'AMO500', 'VITC1000'],
  },
];
