const fs = require('fs');
const path = require('path');

/**
 * Recursively serializes a Playwright accessibility snapshot node into a clean YAML format.
 * Strips non-semantic wrapper elements to reduce model context footprint.
 */
function serializeNode(node, depth = 0) {
  if (!node) return '';

  const indent = '  '.repeat(depth);
  let lines = [];

  // Determine if this element is semantically meaningful
  const isSemantic = node.role && 
                     node.role !== 'generic' && 
                     node.role !== 'none' && 
                     node.role !== 'Block';

  const hasContent = node.name || node.value || node.description;

  if (isSemantic || hasContent) {
    // Start node list item
    lines.push(`${indent}- role: ${node.role || 'element'}`);
    
    if (node.name) {
      lines.push(`${indent}  name: "${node.name.replace(/"/g, '\\"')}"`);
    }
    if (node.value) {
      lines.push(`${indent}  value: "${node.value.replace(/"/g, '\\"')}"`);
    }
    if (node.description) {
      lines.push(`${indent}  description: "${node.description.replace(/"/g, '\\"')}"`);
    }
    if (node.checked !== undefined) {
      lines.push(`${indent}  checked: ${node.checked}`);
    }
    if (node.disabled !== undefined) {
      lines.push(`${indent}  disabled: ${node.disabled}`);
    }
    if (node.expanded !== undefined) {
      lines.push(`${indent}  expanded: ${node.expanded}`);
    }

    // Process children at next depth level
    if (node.children && node.children.length > 0) {
      lines.push(`${indent}  children:`);
      for (const child of node.children) {
        const childYaml = serializeNode(child, depth + 2);
        if (childYaml) {
          lines.push(childYaml);
        }
      }
    }
  } else {
    // If the node is just a structural container, directly serialize children at the SAME depth level
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childYaml = serializeNode(child, depth);
        if (childYaml) {
          lines.push(childYaml);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Main function to write the serialized tree to disk.
 */
function writeAccessibilitySnapshot(snapshot, outputPath) {
  const resolvedPath = outputPath || path.resolve(__dirname, '../snapshots/active-tree.yaml');
  
  // Ensure target folder exists
  const targetDir = path.dirname(resolvedPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const yamlTree = serializeNode(snapshot);
  fs.writeFileSync(resolvedPath, yamlTree || '[]', 'utf8');
  return resolvedPath;
}

module.exports = {
  serializeNode,
  writeAccessibilitySnapshot
};
