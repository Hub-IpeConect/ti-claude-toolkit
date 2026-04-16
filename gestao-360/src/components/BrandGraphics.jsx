/**
 * Grafismos da marca Ipeconect
 * Triangulos e padroes inspirados no logo
 * Cores: Azul #46548C / #8098C8 e Laranja #E8A14A
 */

// Triangulo simples (seta play do logo)
export function BrandArrow({ className = '', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 48 42" fill={color} className={className}>
      <path d="M3 36 L24 4 L45 36 Q45 40 41 40 L7 40 Q3 40 3 36Z" />
    </svg>
  )
}

// Faixa de setas zigzag (grafismo horizontal)
export function BrandZigzag({ className = '', color = '#46548C' }) {
  return (
    <svg viewBox="0 0 400 40" fill={color} className={className}>
      <path d="M0 20 L20 5 L40 20 L20 35Z" opacity="0.3" />
      <path d="M50 20 L80 5 L110 20 L80 35Z" opacity="0.5" />
      <path d="M120 20 L160 2 L200 20 L160 38Z" opacity="0.7" />
      <path d="M210 20 L250 5 L290 20 L250 35Z" opacity="0.5" />
      <path d="M300 20 L330 8 L360 20 L330 32Z" opacity="0.3" />
    </svg>
  )
}

// Padrao de mini-triangulos (background pattern)
export function BrandPattern({ className = '', color = '#46548C', opacity = 0.04 }) {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <defs>
        <pattern id="brand-triangles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M5 15 L12 3 L19 15Z" fill={color} opacity={opacity} />
          <path d="M25 35 L30 25 L35 35Z" fill={color} opacity={opacity * 0.7} />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#brand-triangles)" />
    </svg>
  )
}

// Circulo de setas (grafismo circular - tipo starburst)
export function BrandStarburst({ className = '', color = '#8098C8' }) {
  return (
    <svg viewBox="0 0 120 120" fill={color} className={className}>
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          key={i}
          d="M60 60 L55 30 L65 30Z"
          opacity={0.08 + (i % 3) * 0.03}
          transform={`rotate(${i * 30} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="18" opacity="0.06" />
    </svg>
  )
}
