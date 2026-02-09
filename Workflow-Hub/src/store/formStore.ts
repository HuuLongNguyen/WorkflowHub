
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Form, Field } from '../types';

interface FormState {
    forms: Form[];

    addForm: (form: Form) => void;
    updateForm: (id: string, updates: Partial<Form>) => void;
    deleteForm: (id: string) => void;

    // Helper to update fields within a form
    updateFormField: (formId: string, fieldId: string, updates: Partial<Field>) => void;

    importForms: (forms: Form[]) => void;
}

export const useFormStore = create<FormState>()(
    persist(
        (set) => ({
            forms: [],

            addForm: (form) => set((state) => ({
                forms: [...state.forms, form]
            })),

            updateForm: (id, updates) => set((state) => ({
                forms: state.forms.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f)
            })),

            deleteForm: (id) => set((state) => ({
                forms: state.forms.filter(f => f.id !== id)
            })),

            updateFormField: (formId, fieldId, updates) => set((state) => ({
                forms: state.forms.map(f => {
                    if (f.id !== formId) return f;
                    const field = f.fieldsById[fieldId];
                    if (!field) return f;

                    return {
                        ...f,
                        fieldsById: {
                            ...f.fieldsById,
                            [fieldId]: { ...field, ...updates }
                        },
                        updatedAt: new Date().toISOString()
                    };
                })
            })),

            importForms: (forms) => set({ forms }),
        }),
        {
            name: 'tm_forms_v1',
        }
    )
);
