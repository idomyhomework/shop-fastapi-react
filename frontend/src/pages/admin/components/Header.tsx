import React from 'react'
import CloseIcon from './img/close.svg';
import OpenIcon from './img/menu.svg';
import { navButtons } from './constants/constants';

type HeaderProps = {
   onChangeSection: (id: number) => void;
}

export const Header = ({onChangeSection}: HeaderProps) => {

   navButtons.map((item) => {
      item.name = item.name.charAt(0).toUpperCase() + item.name.slice(1); 
   })

   return (
      <header className='border-b-2 h-14 border-b-red-50'>
      <div className="w-9/12 px-4 flex h-full items-center justify-between mx-auto"> 
         <h1 className="text-lg">Panel Administrativo</h1>
            <ul className='header-nav'>
            {navButtons.map((button)=>(
               <button className='header-nav-btn'
                        onClick={()=>{
                           onChangeSection(button.id);
                        }}
                        key={button.id}>{button.name}
               </button>
            ))}
            </ul>
      </div>
      </header>
   )
}
