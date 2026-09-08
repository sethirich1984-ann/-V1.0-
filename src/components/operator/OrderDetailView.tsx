import React from 'react';
import { OrderItem } from '../../types';
import { OrderDetailSubPage } from '../common/OrderDetailSubPage';

interface OrderDetailViewProps {
  order: OrderItem;
  onBack: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, onBack }) => {
  return <OrderDetailSubPage order={order} onBack={onBack} userRole="platform_op" />;
};
