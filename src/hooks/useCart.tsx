import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  addProduct: (pproductId: number) => Promise<void>;
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
      const findProduct = cart.find(item => item.id === productId)

      if (!findProduct){
        const product = await api.get(`products/${productId}`);
        const stock = await api.get(`stock/${productId}`);


        if(stock.data.amount > 0) {
          const updatedCart = [...cart, { ...product.data,amount:1}]
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
          return;
        }else{
          throw toast.error('Quantidade solicitada fora de estoque');
        }
      }

      updateProductAmount({ productId, amount:findProduct.amount+1})

    } catch(err) {
      if (err instanceof Error) {
        toast.error('Erro na adição do produto');
      } 
      
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find(item => item.id === productId);
      if (findProduct){
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }else {
        throw new Error('No such product on  cart');
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
      const stock = await api.get(`stock/${productId}`);

      const product = cart.find(item => item.id === productId)

      if(!product || amount<=0){
        throw new Error();
      }

      if(stock.data.amount >= amount){
        const updatedCart = cart.map(item => item.id === productId ? { ...item, amount } : item);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw toast.error('Quantidade solicitada fora de estoque');
      }

    } catch (err) {
      if (err instanceof Error) {
        toast.error('Erro na alteração de quantidade do produto');
      } 
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
