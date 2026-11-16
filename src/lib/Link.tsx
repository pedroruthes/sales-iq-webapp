import { Link as RRLink, type LinkProps as RRLinkProps } from 'react-router-dom'
import type { ReactNode, CSSProperties, MouseEventHandler } from 'react'

type Props = Omit<RRLinkProps, 'to'> & {
  href?: string
  to?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLAnchorElement>
  prefetch?: boolean
  replace?: boolean
}

/** Compatível com next/link (prop href). */
export default function Link({ href, to, prefetch: _p, ...rest }: Props) {
  return <RRLink to={href ?? to ?? '/'} {...rest} />
}
