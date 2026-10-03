import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
} from 'react'
import { createPortal } from 'react-dom'

import styles from './GlassDropdown.module.css'

interface MenuCoords {
  top?: number
  bottom?: number
  left: number
  openUp: boolean
  maxHeight: number
}

const MENU_GAP = 6
const MENU_VIEWPORT_PAD = 8
const MENU_MAX_HEIGHT = 400

function measureMenuCoords(
  trigger: HTMLElement,
  preferred: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end',
): MenuCoords {
  const rect = trigger.getBoundingClientRect()
  
  // Default to 200 just for early calculation, actual height is handled by CSS max-height
  const menuHeight = 200 
  const spaceBelow = window.innerHeight - rect.bottom - MENU_VIEWPORT_PAD
  const spaceAbove = rect.top - MENU_VIEWPORT_PAD

  const prefersTop = preferred.startsWith('top')
  
  let openUp: boolean
  if (prefersTop) {
    openUp = spaceAbove >= menuHeight || spaceAbove > spaceBelow
  } else {
    openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow
  }

  const available = openUp ? spaceAbove : spaceBelow
  const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, available - MENU_GAP))

  // Estimate width (will be bounded by CSS)
  const menuEstWidth = 200
  
  let left = rect.left
  const prefersEnd = preferred.endsWith('end')
  
  if (prefersEnd) {
    left = rect.right - menuEstWidth // roughly align end
  }
  
  // Keep the menu fully inside the viewport horizontally.
  const maxLeft = Math.max(MENU_VIEWPORT_PAD, window.innerWidth - menuEstWidth - MENU_VIEWPORT_PAD)
  left = Math.min(Math.max(left, MENU_VIEWPORT_PAD), maxLeft)

  if (openUp) {
    return {
      bottom: Math.max(MENU_VIEWPORT_PAD, window.innerHeight - rect.top + MENU_GAP),
      left,
      openUp: true,
      maxHeight,
    }
  }

  return {
    top: Math.min(rect.bottom + MENU_GAP, window.innerHeight - MENU_VIEWPORT_PAD - 40),
    left,
    openUp: false,
    maxHeight,
  }
}

export interface GlassDropdownProps {
  trigger: ReactNode
  children: ReactNode
  placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  disabled?: boolean
  className?: string
}

export function GlassDropdown({
  trigger,
  children,
  placement = 'bottom-start',
  disabled = false,
  className = '',
}: GlassDropdownProps) {
  const reactId = useId()
  const triggerId = `${reactId}-trigger`

  const triggerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  const updateCoords = useCallback(() => {
    const triggerEl = triggerRef.current
    if (!triggerEl) return
    setCoords(measureMenuCoords(triggerEl, placement))
  }, [placement])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const toggle = useCallback(() => {
    if (disabled) return
    if (open) {
      close()
    } else {
      updateCoords()
      setOpen(true)
    }
  }, [disabled, open, close, updateCoords])

  // Keep the floating menu glued to the trigger while open (scroll / resize / layout).
  useLayoutEffect(() => {
    if (!open) return
    updateCoords()
  }, [open, updateCoords])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      close()
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        document.getElementById(triggerId)?.focus()
      }
    }

    function onViewportChange() {
      updateCoords()
    }

    // pointerdown (not mousedown) so we dismiss before parent click handlers race.
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onViewportChange)
    // Capture scroll from any ancestor so nested overflow containers re-position the menu.
    window.addEventListener('scroll', onViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [close, open, triggerId, updateCoords])
  
  // Clone the trigger to inject ref, id, onClick, etc.
  let triggerElement = trigger
  if (isValidElement(trigger)) {
    triggerElement = cloneElement(trigger as React.ReactElement<any>, {
      ref: (node: HTMLElement) => {
        // Handle refs safely if the user passed one
        const triggerChild = trigger as any
        if (triggerChild.ref) {
          if (typeof triggerChild.ref === 'function') {
            triggerChild.ref(node)
          } else if (triggerChild.ref.hasOwnProperty('current')) {
            triggerChild.ref.current = node
          }
        }
        (triggerRef as any).current = node
      },
      id: triggerId,
      onClick: (e: any) => {
        toggle()
        if ((trigger.props as any).onClick) (trigger.props as any).onClick(e)
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      disabled: disabled || (trigger.props as any).disabled,
    })
  } else {
    triggerElement = (
      <div 
        ref={triggerRef as any}
        id={triggerId}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ display: 'inline-block', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {trigger}
      </div>
    )
  }

  return (
    <>
      {triggerElement}

      {createPortal(
        <div
          ref={menuRef}
          className={`
            ${styles.menu} 
            ${open ? styles.menuOpen : ''} 
            ${coords?.openUp ? styles.menuUp : styles.menuDown}
            ${className}
          `.trim()}
          style={{
            top: coords?.top,
            bottom: coords?.bottom,
            left: coords?.left,
            maxHeight: coords?.maxHeight,
          }}
          role="menu"
        >
          {/* We intercept clicks inside the menu to close it after action */}
          <div onClick={(e) => {
             // Let the click event propagate first so item onClick handlers fire, 
             // but close the menu unless they clicked something that shouldn't close it
             const target = e.target as HTMLElement
             if (target.closest(`.${styles.item}`)) {
               // Delay slightly so the ripple or click effect can happen
               setTimeout(() => close(), 0)
             }
          }}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export interface GlassDropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  destructive?: boolean
}

export function GlassDropdownItem({ 
  children, 
  icon, 
  destructive, 
  className = '', 
  ...props 
}: GlassDropdownItemProps) {
  return (
    <button
      className={`
        ${styles.item}
        ${destructive ? styles.itemDestructive : ''}
        ${props.disabled ? styles.itemDisabled : ''}
        ${className}
      `.trim()}
      role="menuitem"
      {...props}
    >
      {icon && <span className={styles.itemIcon}>{icon}</span>}
      <span className={styles.itemLabel}>{children}</span>
    </button>
  )
}

export function GlassDropdownSeparator() {
  return <div className={styles.separator} role="separator" />
}
