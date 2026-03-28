import { Fragment } from 'react'
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption as HeadlessListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ListboxOption {
  id: string
  name: string
  status?: 'active' | 'inactive'
  meta?: string
  disabled?: boolean
}

interface ListboxProps {
  value: string | null
  onChange: (value: string) => void
  options: ListboxOption[]
  placeholder?: string
  className?: string
}

export function Listbox({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
}: ListboxProps) {
  const selected = options.find((opt) => opt.id === value)

  return (
    <HeadlessListbox value={value ?? undefined} onChange={onChange}>
      <div className={cn('relative', className)}>
        <ListboxButton
          className={cn(
            'relative w-full cursor-pointer rounded-sm bg-slate-800 py-1.5 pl-3 pr-8 text-left text-sm',
            'border border-slate-700 text-slate-100',
            'hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950',
            'transition-colors'
          )}
        >
          <span className="block truncate font-mono text-xs">
            {selected ? selected.name : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown size={14} className="text-slate-400" />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            className={cn(
              'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md',
              'bg-slate-900 p-1 text-sm text-slate-100',
              'border border-slate-700 shadow-lg',
              'focus:outline-none'
            )}
          >
            {options.length === 0 ? (
              <div className="py-6 text-center text-slate-500">No options</div>
            ) : (
              options.map((option) => (
                <HeadlessListboxOption
                  key={option.id}
                  value={option.id}
                  disabled={option.disabled}
                  className={({ active }: { active: boolean }) =>
                    cn(
                      'relative cursor-pointer select-none py-2.5 pl-3 pr-4 rounded-sm',
                      active && 'bg-slate-800 text-slate-100',
                      !active && 'text-slate-100',
                      option.disabled && 'cursor-not-allowed opacity-50'
                    )
                  }
                >
                  {({ selected }: { selected: boolean }) => (
                    <div className="flex items-center gap-3">
                      {option.status && (
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            option.status === 'active' ? 'bg-green-500' : 'bg-slate-600'
                          )}
                        />
                      )}
                      <span className="block truncate flex-1">{option.name}</span>
                      {option.meta && (
                        <span className="text-slate-500 text-xs shrink-0">{option.meta}</span>
                      )}
                      {selected && <Check size={16} className="text-blue-500 shrink-0" />}
                    </div>
                  )}
                </HeadlessListboxOption>
              ))
            )}
          </ListboxOptions>
        </Transition>
      </div>
    </HeadlessListbox>
  )
}
