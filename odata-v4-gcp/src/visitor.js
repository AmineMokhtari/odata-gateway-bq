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
export class Visitor {
    dialect;
    constructor(dialect) {
        this.dialect = dialect;
    }
    visit(node) {
        switch (node.type) {
            case 'Query': return this.visitQuery(node);
            case 'Filter': return this.visitFilter(node);
            case 'Select': return this.visitSelect(node);
            case 'BinaryExpression': return this.visitBinaryExpression(node);
            case 'Literal': return this.visitLiteral(node);
            case 'Property': return this.visitProperty(node);
            case 'OrderBy': return this.visitOrderBy(node);
            case 'Top': return this.visitLiteral(node);
            case 'Skip': return this.visitLiteral(node);
            case 'Count': return this.visitLiteral(node);
            case 'Expand': return this.visitExpand(node);
            case 'ExpandItem': return this.visitExpandItem(node);
            case 'Search': return this.visitSearch(node);
            case 'Compute': return this.visitCompute(node);
            case 'ComputeItem': return this.visitComputeItem(node);
            default:
                throw new Error(`Unsupported node type: ${node.type}`);
        }
    }
}
//# sourceMappingURL=visitor.js.map