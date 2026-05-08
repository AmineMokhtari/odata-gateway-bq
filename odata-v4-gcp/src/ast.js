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
export class ASTNode {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
export class QueryNode extends ASTNode {
    options;
    type = 'Query';
    constructor(start, end, options = new Map()) {
        super(start, end);
        this.options = options;
    }
}
export class FilterNode extends ASTNode {
    expression;
    type = 'Filter';
    constructor(start, end, expression) {
        super(start, end);
        this.expression = expression;
    }
}
export class SelectNode extends ASTNode {
    properties;
    type = 'Select';
    constructor(start, end, properties) {
        super(start, end);
        this.properties = properties;
    }
}
export class PropertyNode extends ASTNode {
    name;
    type = 'Property';
    constructor(start, end, name) {
        super(start, end);
        this.name = name;
    }
}
export class LiteralNode extends ASTNode {
    value;
    literalType;
    type = 'Literal';
    constructor(start, end, value, literalType) {
        super(start, end);
        this.value = value;
        this.literalType = literalType;
    }
}
export class BinaryExpressionNode extends ASTNode {
    left;
    operator;
    right;
    type = 'BinaryExpression';
    constructor(start, end, left, operator, right) {
        super(start, end);
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}
export class UnaryExpressionNode extends ASTNode {
    operator;
    expression;
    type = 'UnaryExpression';
    constructor(start, end, operator, expression) {
        super(start, end);
        this.operator = operator;
        this.expression = expression;
    }
}
export class OrderByNode extends ASTNode {
    items;
    type = 'OrderBy';
    constructor(start, end, items) {
        super(start, end);
        this.items = items;
    }
}
export class ExpandItem extends ASTNode {
    navigationProperty;
    query;
    type = 'ExpandItem';
    constructor(start, end, navigationProperty, query) {
        super(start, end);
        this.navigationProperty = navigationProperty;
        this.query = query;
    }
}
export class ExpandNode extends ASTNode {
    items;
    type = 'Expand';
    constructor(start, end, items) {
        super(start, end);
        this.items = items;
    }
}
export class SearchNode extends ASTNode {
    expression;
    type = 'Search';
    constructor(start, end, expression) {
        super(start, end);
        this.expression = expression;
    }
}
export class ComputeItem extends ASTNode {
    expression;
    alias;
    type = 'ComputeItem';
    constructor(start, end, expression, alias) {
        super(start, end);
        this.expression = expression;
        this.alias = alias;
    }
}
export class ComputeNode extends ASTNode {
    items;
    type = 'Compute';
    constructor(start, end, items) {
        super(start, end);
        this.items = items;
    }
}
//# sourceMappingURL=ast.js.map