"""
Rewrite SQL so the file contains no `--` sequence anywhere.

Some editors and renderers turn `--` into an en dash, or drop a character on
paste, which makes a comment line parse as SQL and fail. Converting every line
comment to a /* ... */ block keeps the documentation while removing the
sequence that gets mangled.

Single-quoted strings are tracked across lines so a `--` inside data is never
touched. Dollar-quoted bodies ($$ ... $$) are treated as code, because in this
codebase they are all plpgsql/sql function bodies rather than data — so a `--`
inside one is a genuine comment and must be converted too.
"""
import re
import sys


def split_comment(line, in_single):
    """Return (code, comment_or_None, in_single_after)."""
    i, n = 0, len(line)

    while i < n:
        ch = line[i]

        if in_single:
            if ch == "'":
                if i + 1 < n and line[i + 1] == "'":   # '' escapes a quote
                    i += 2
                    continue
                in_single = False
            i += 1
            continue

        if ch == "'":
            in_single = True
            i += 1
            continue

        if ch == '-' and i + 1 < n and line[i + 1] == '-':
            return line[:i], line[i + 2:], in_single

        i += 1

    return line, None, in_single


def safe(text):
    return text.replace('*/', '* /').rstrip()


def convert(sql):
    out, pending, indent, in_single = [], [], '', False

    def flush():
        nonlocal pending, indent
        body = [safe(t) for t in pending]
        while body and not body[0].strip():
            body.pop(0)
        while body and not body[-1].strip():
            body.pop()
        if body:
            if len(body) == 1:
                out.append(f'{indent}/* {body[0].strip()} */')
            else:
                out.append(f'{indent}/*')
                out.extend(f'{indent}   {e.strip()}' if e.strip() else indent for e in body)
                out.append(f'{indent} */')
        pending = []

    for line in sql.split('\n'):
        code, comment, in_single = split_comment(line, in_single)

        if comment is None:
            flush()
            out.append(line)
        elif code.strip() == '':
            if not pending:
                indent = code
            pending.append(comment)
        else:
            flush()
            text = safe(comment).strip()
            out.append(f'{code.rstrip()}  /* {text} */' if text else code.rstrip())

    flush()
    result = '\n'.join(out)

    # Ruler lines now live inside block comments; swap their hyphens for '='
    # so that no `--` remains anywhere in the file.
    result = re.sub(r'-{2,}', lambda m: '=' * len(m.group(0)), result)
    return result


if __name__ == '__main__':
    sys.stdout.write(convert(sys.stdin.read()))
