import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('btn btn-primary', className)} {...props} />
}

export function ButtonOutline({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('btn btn-outline', className)} {...props} />
}