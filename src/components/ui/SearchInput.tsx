import { InputHTMLAttributes } from 'react'
import { Input } from './Input'
import { Search } from 'lucide-react'

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <Input className="pl-10" placeholder="Search..." {...props} />
    </div>
  )
}