import logoIpeconect from '@assets/logo-ipeconect.png'

/**
 * Logo oficial da Ipeconect.
 *
 * Props:
 *   height   - altura em px (default 40)
 *   white    - aplica filtro para deixar a logo toda branca (uso na sidebar escura)
 *   onlyMark - mostra só o pentágono/inicio da logo (sidebar colapsada)
 */
export default function IpeconectLogo({ height = 40, white = false, onlyMark = false }) {
  const style = {
    height,
    width: 'auto',
    filter: white ? 'brightness(0) invert(1)' : 'none',
  }

  if (onlyMark) {
    // Sidebar colapsada: mostra só a parte esquerda (pentágono)
    // A logo tem proporção ~3:1, então para pegar só o pentágono cortamos ~35% da largura
    const markWidth = Math.round(height * 0.55)
    return (
      <div
        style={{ height, width: markWidth, overflow: 'hidden', flexShrink: 0 }}
        aria-label="Ipeconect"
      >
        <img
          src={logoIpeconect}
          alt="Ipeconect"
          style={{
            height,
            width: 'auto',
            maxWidth: 'none',
            filter: white ? 'brightness(0) invert(1)' : 'none',
          }}
        />
      </div>
    )
  }

  return (
    <img
      src={logoIpeconect}
      alt="Ipeconect"
      style={style}
    />
  )
}
