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

import * as AST from './ast.js';

export interface Dialect {
  escapeIdentifier(name: string): string;
  renderLiteral(value: any, type: string, paramName: string): string;
  renderBinaryExpression(left: string, operator: string, right: string): string;
  renderUnaryExpression(operator: string, expression: string): string;
  renderSelect(properties: string[]): string;
  renderFilter(expression: string): string;
}

export abstract class Visitor {
  protected dialect: Dialect;
  
  constructor(dialect: Dialect) {
    this.dialect = dialect;
  }

  public visit(node: AST.ASTNode): any {
    switch (node.type) {
      case 'Query': return this.visitQuery(node as AST.QueryNode);
      case 'Filter': return this.visitFilter(node as AST.FilterNode);
      case 'Select': return this.visitSelect(node as AST.SelectNode);
      case 'BinaryExpression': return this.visitBinaryExpression(node as AST.BinaryExpressionNode);
      case 'Literal': return this.visitLiteral(node as AST.LiteralNode);
      case 'Property': return this.visitProperty(node as AST.PropertyNode);
      case 'OrderBy': return this.visitOrderBy(node as AST.OrderByNode);
      case 'Top': return this.visitLiteral(node as AST.LiteralNode);
      case 'Skip': return this.visitLiteral(node as AST.LiteralNode);
      case 'Count': return this.visitLiteral(node as AST.LiteralNode);
      case 'Expand': return this.visitExpand(node as AST.ExpandNode);
      case 'ExpandItem': return this.visitExpandItem(node as AST.ExpandItem);
      case 'Search': return this.visitSearch(node as AST.SearchNode);
      case 'Compute': return this.visitCompute(node as AST.ComputeNode);
      case 'ComputeItem': return this.visitComputeItem(node as AST.ComputeItem);
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  protected abstract visitQuery(node: AST.QueryNode): any;
  protected abstract visitFilter(node: AST.FilterNode): any;
  protected abstract visitSelect(node: AST.SelectNode): any;
  protected abstract visitBinaryExpression(node: AST.BinaryExpressionNode): any;
  protected abstract visitLiteral(node: AST.LiteralNode): any;
  protected abstract visitProperty(node: AST.PropertyNode): any;
  protected abstract visitOrderBy(node: AST.OrderByNode): any;
  protected abstract visitExpand(node: AST.ExpandNode): any;
  protected abstract visitExpandItem(node: AST.ExpandItem): any;
  protected abstract visitSearch(node: AST.SearchNode): any;
  protected abstract visitCompute(node: AST.ComputeNode): any;
  protected abstract visitComputeItem(node: AST.ComputeItem): any;
}
