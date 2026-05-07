/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * OData v4 Lexer (Tokenizer)
 */

export enum TokenType {
  Identifier,
  String,
  Number,
  Boolean,
  Null,
  Operator,
  Delimiter,
  SystemQueryOption,
  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export class Lexer {
  private pos = 0;
  private length: number;

  constructor(private input: string) {
    this.length = input.length;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.length) {
      const char = this.input[this.pos];

      if (this.isWhitespace(char)) {
        this.pos++;
        continue;
      }

      if (char === '$') {
        tokens.push(this.readSystemQueryOption());
        continue;
      }

      if (this.isIdentifierStart(char)) {
        tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      if (char === "'") {
        tokens.push(this.readString());
        continue;
      }

      if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek()))) {
        tokens.push(this.readNumberOrDate());
        continue;
      }

      if (this.isDelimiter(char)) {
        tokens.push({ type: TokenType.Delimiter, value: char, start: this.pos, end: ++this.pos });
        continue;
      }

      throw new Error(`Unexpected character '${char}' at position ${this.pos}`);
    }

    tokens.push({ type: TokenType.EOF, value: '', start: this.pos, end: this.pos });
    return tokens;
  }

  private readSystemQueryOption(): Token {
    const start = this.pos;
    this.pos++; // skip $
    while (this.pos < this.length && this.isIdentifierPart(this.input[this.pos])) {
      this.pos++;
    }
    return { type: TokenType.SystemQueryOption, value: this.input.substring(start, this.pos), start, end: this.pos };
  }

  private readIdentifierOrKeyword(): Token {
    const start = this.pos;
    while (this.pos < this.length && this.isIdentifierPart(this.input[this.pos])) {
      this.pos++;
    }
    const value = this.input.substring(start, this.pos);
    
    // Check for keywords
    if (value === 'true' || value === 'false') {
      return { type: TokenType.Boolean, value, start, end: this.pos };
    }
    if (value === 'null') {
      return { type: TokenType.Null, value, start, end: this.pos };
    }
    
    // OData operators are words: eq, ne, gt, etc.
    const operators = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'and', 'or', 'not', 'has', 'in', 'add', 'sub', 'mul', 'div', 'mod'];
    if (operators.includes(value)) {
      return { type: TokenType.Operator, value, start, end: this.pos };
    }

    return { type: TokenType.Identifier, value, start, end: this.pos };
  }

  private readString(): Token {
    const start = this.pos;
    this.pos++; // skip '
    let value = '';
    while (this.pos < this.length) {
      if (this.input[this.pos] === "'") {
        if (this.peek() === "'") { // Escaped single quote ''
          this.pos++;
          value += "'";
        } else {
          this.pos++; // skip closing '
          return { type: TokenType.String, value, start, end: this.pos };
        }
      } else {
        value += this.input[this.pos];
      }
      this.pos++;
    }
    throw new Error(`Unterminated string starting at position ${start}`);
  }

  private readNumberOrDate(): Token {
    const start = this.pos;
    if (this.input[this.pos] === '-') this.pos++;
    
    while (this.pos < this.length) {
      const c = this.input[this.pos];
      if (this.isDigit(c) || c === '-' || c === ':' || c === '.' || c === 'T' || c === 'Z' || c === '+' || c === ' ') {
        // Hyphen/Plus/Space only allowed if followed by a digit (except leading hyphen)
        if ((c === '-' || c === '+' || c === ' ') && !this.isDigit(this.peek())) {
          break;
        }
        this.pos++;
      } else {
        break;
      }
    }
    const value = this.input.substring(start, this.pos).trim();
    return { type: TokenType.Number, value, start, end: this.pos };
  }

  private isWhitespace(c: string) { return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '+'; }
  private isDigit(c: string) { return c >= '0' && c <= '9'; }
  private isIdentifierStart(c: string) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'; }
  private isIdentifierPart(c: string) { return this.isIdentifierStart(c) || this.isDigit(c); }
  private isDelimiter(c: string) { return '(),=/&?;'.includes(c); }
  private peek() { return this.pos + 1 < this.length ? this.input[this.pos + 1] : ''; }
}
