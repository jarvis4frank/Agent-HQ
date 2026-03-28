// @ts-nocheck
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
  triggerRef?: React.Ref<HTMLButtonElement>
}

export function Listbox({
  value,
  onChange,
  options,
  placeholder = 'Select Project...',
  className,
  triggerRef,
}: ListboxProps) {
  const selected = options.find((opt) => opt.id === value)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Headless UI types are incompatible with React 18 types
  return (
    <HeadlessListbox value={value ?? undefined} onChange={onChange}>
      <div className={cn('relative', className)}>
        <ListboxButton
          // @ts-ignore - ref types incompatible
          ref={triggerRef}
          className={cn(
            'relative cursor-pointer rounded-[4px] py-1 pl-3 pr-6 text-left',
            'border border-[#33373f] bg-[#1e232b]',
            'hover:bg-[#252a33] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950',
            'transition-colors'
          )}
          style={{
            minWidth: '140px',
            height: '32px',
            paddingTop: '4px',
            paddingBottom: '4px',
          }}
        >
          <span
            className="block truncate"
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#8b949e',
              fontWeight: 400,
            }}
          >
            {selected ? selected.name : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown size={14} className="text-[#8b949e]" />
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
