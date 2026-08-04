// Splits agent text on ``` fenced code blocks and renders code in <pre><code>
export function renderFormattedText(text) {
  if (!text) return null
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g)
  // String.split with capture groups yields: [plain, lang, code, plain, lang, code, ...]
  const nodes = []
  for (let i = 0; i < parts.length; i += 3) {
    const plain = parts[i]
    const lang = parts[i + 1]
    const code = parts[i + 2]

    if (plain) {
      plain.split('\n').forEach((line, idx, arr) => {
        nodes.push(line)
        if (idx < arr.length - 1) nodes.push(<br key={`br-${nodes.length}`} />)
      })
    }
    if (code !== undefined) {
      nodes.push(
        <pre className="code-block" key={`code-${nodes.length}`}>
          {lang ? <span className="code-lang">{lang}</span> : null}
          <code>{code.replace(/\n$/, '')}</code>
        </pre>
      )
    }
  }
  return nodes
}
