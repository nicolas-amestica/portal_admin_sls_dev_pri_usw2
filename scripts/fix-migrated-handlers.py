#!/usr/bin/env python3
"""
Script para corregir errores de sintaxis comunes en handlers migrados al patrón middleware.
Uso: python3 scripts/fix-migrated-handlers.py <directorio>
"""

import os
import re
import sys

def fix_inline_if_statements(content):
    """
    Convierte if statements inline mal formados en bloques correctos.
    Patrón: if (condition) const error = new Error('...');
    Resultado: if (condition) {
      const error = new Error('...');
      error.statusCode = XXX;
      throw error;
    }
    """
    # Patrón para detectar if inline con const error
    pattern = r'if\s*\(([^)]+)\)\s*const\s+error\s*=\s*new\s+Error\(([^\n]+)'

    def replace_inline_if(match):
        condition = match.group(1)
        error_msg = match.group(2)
        # Asegurar que el mensaje de error termine correctamente
        if not error_msg.rstrip().endswith(');'):
            if error_msg.rstrip().endswith("'") or error_msg.rstrip().endswith('"'):
                error_msg = error_msg.rstrip() + ');'

        return f"""if ({condition}) {{
    const error = new Error({error_msg}
    error.statusCode = 400;
    throw error;
  }}"""

    content = re.sub(pattern, replace_inline_if, content)
    return content

def fix_orphan_error_statements(content):
    """
    Elimina líneas sueltas de error.statusCode y throw error que quedaron
    después de una corrección previa.
    """
    lines = content.split('\n')
    fixed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Si encontramos un throw error; suelto después de un if con bloque,
        # lo eliminamos
        if re.match(r'\s*throw\s+error;\s*$', line):
            # Verificar si la línea anterior termina un bloque if
            if i > 0 and re.search(r'\}\s*$', fixed_lines[-1]):
                # Es un throw error; suelto, lo omitimos
                i += 1
                continue

        # Si encontramos error.statusCode suelto, lo omitimos
        if re.match(r'\s*error\.statusCode\s*=\s*\d+;\s*$', line):
            # Verificar si está dentro de un bloque o suelto
            if i > 0 and not re.search(r'const\s+error', fixed_lines[-1]):
                i += 1
                continue

        fixed_lines.append(line)
        i += 1

    return '\n'.join(fixed_lines)

def fix_json_parse_body(content):
    """
    Reemplaza JSON.parse(event.body) por event.body
    ya que el middleware parsea automáticamente.
    """
    content = re.sub(
        r'JSON\.parse\(event\.body\)',
        'event.body',
        content
    )

    # También corregir const {...} = body; a const {...} = event.body;
    content = re.sub(
        r'const\s+\{([^}]+)\}\s*=\s*body;',
        r'const {\1} = event.body;',
        content
    )

    return content

def fix_indentation_after_closing_braces(content):
    """
    Corrige la indentación de código que quedó mal después de una migración.
    """
    lines = content.split('\n')
    fixed_lines = []
    base_indent = 0

    for line in lines:
        stripped = line.lstrip()

        # Detectar nivel de indentación por llaves
        if stripped.startswith('const handler = async'):
            base_indent = len(line) - len(stripped)

        # Si la línea anterior termina con }; y esta línea tiene
        # indentación incorrecta (demasiada), corregir
        if fixed_lines and re.search(r'\}\s*;?\s*$', fixed_lines[-1]):
            # Si la línea actual es una declaración const o comando,
            # debería tener la indentación base + 2 espacios
            if stripped.startswith('const ') or stripped.startswith('await ') or stripped.startswith('return '):
                # Recalcular indentación
                line = '  ' + stripped

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def process_file(filepath):
    """Procesa un archivo aplicando todas las correcciones."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Aplicar correcciones en orden
        content = fix_inline_if_statements(content)
        content = fix_orphan_error_statements(content)
        content = fix_json_parse_body(content)
        # content = fix_indentation_after_closing_braces(content)  # Comentado por ser muy agresivo

        # Si hubo cambios, guardar
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Corregido: {filepath}")
            return True
        else:
            print(f"⏭️  Sin cambios: {filepath}")
            return False

    except Exception as e:
        print(f"❌ Error procesando {filepath}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/fix-migrated-handlers.py <directorio>")
        print("Ejemplo: python3 scripts/fix-migrated-handlers.py services/api-payment/functions")
        sys.exit(1)

    directory = sys.argv[1]

    if not os.path.isdir(directory):
        print(f"❌ El directorio no existe: {directory}")
        sys.exit(1)

    print(f"\n🔧 Corrigiendo handlers en: {directory}\n")

    fixed_count = 0
    total_count = 0

    for filename in os.listdir(directory):
        if filename.endswith('.js') and not filename.startswith('.'):
            filepath = os.path.join(directory, filename)
            total_count += 1
            if process_file(filepath):
                fixed_count += 1

    print(f"\n📊 Resumen:")
    print(f"   Total archivos: {total_count}")
    print(f"   Corregidos: {fixed_count}")
    print(f"   Sin cambios: {total_count - fixed_count}\n")

if __name__ == '__main__':
    main()
