import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
    
      const {data} = await api.get<Stock>(`/stock/${productId}`);
      const newCart = [...cart];
      const productExists = newCart.find(p => p.id === productId);

      const amount = productExists ? productExists.amount + 1 : 1;

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {

        setCart(cart.map(p => p.id === productId ? { ...p, amount: amount  } : p));
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart.map(p => p.id === productId ? { ...p, amount: amount  } : p)));

      } else {
        const product = await api.get<Product>(`/products/${productId}`);
        newCart.push({ ...product.data, amount: amount});
        setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      }
      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.findIndex(product => product.id === productId);

      if (productExists >= 0) {
        const newCart = cart.filter(p => p.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      const {data} = await api.get<Stock>(`/stock/${productId}`);
      
      const productExists = cart.findIndex(p => p.id === productId);

      const newCart = [...cart];

      const product = newCart[productExists];

      if (productExists <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      if (amount < data.amount && amount >= 1) {
        product.amount = amount;
        setCart(newCart);
      }else {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
