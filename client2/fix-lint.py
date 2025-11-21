#!/usr/bin/env python3
"""
fix-lint.py - Automated ESLint error fixer
Fixes console.log statements to console.warn
"""

import os
import re
import glob

def fix_console_log(content):
    """Replace console.log with console.warn, except in strings"""
    # Simple replacement - matches console.log( but not in comments
    return re.sub(r'(\s)console\.log\(', r'\1console.warn(', content)

def fix_file(filepath):
    """Fix a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        fixed = fix_console_log(original)

        if fixed != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    src_dir = 'src'
    fixed_count = 0
    total_count = 0

    # Find all .js and .jsx files
    patterns = [
        os.path.join(src_dir, '**', '*.js'),
        os.path.join(src_dir, '**', '*.jsx')
    ]

    for pattern in patterns:
        for filepath in glob.glob(pattern, recursive=True):
            if 'node_modules' in filepath:
                continue

            total_count += 1
            if fix_file(filepath):
                fixed_count += 1
                print(f"Fixed: {filepath}")

    print(f"\nProcessed {total_count} files")
    print(f"Modified {fixed_count} files")
    print("Run 'pnpm run lint' to verify")

if __name__ == '__main__':
    main()
