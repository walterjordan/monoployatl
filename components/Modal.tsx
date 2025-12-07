/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const Modal = ({ isOpen, title, children, onClose }: { isOpen: boolean, title: string, children: React.ReactNode, onClose?: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
                    <h3 className="font-bold text-white">{title}</h3>
                    {onClose && <button onClick={onClose} className="text-zinc-400 hover:text-white"><XMarkIcon className="w-5 h-5"/></button>}
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
