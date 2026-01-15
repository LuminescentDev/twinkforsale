/**
 * CSS Sanitizer to prevent XSS attacks via custom CSS
 */

// Dangerous CSS properties and values that could lead to XSS
const DANGEROUS_CSS_PATTERNS = [
  // JavaScript URLs
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:.*script/gi,
  
  // CSS expressions (IE)
  /expression\s*\(/gi,
  /-moz-binding/gi,
  
  // @import with dangerous URLs
  /@import\s+['"]?javascript:/gi,
  /@import\s+['"]?data:.*script/gi,
  
  // HTML injection attempts
  /<\s*script/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /<\s*link/gi,
  /<\s*meta/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  
  // Style tag attempts
  /<\s*\/?\s*style/gi,
];

// Allowed CSS properties (whitelist approach is safer)
const ALLOWED_CSS_PROPERTIES = [
  'color', 'background-color', 'background', 'background-image', 'background-size',
  'background-position', 'background-repeat', 'background-attachment',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'text-align', 'text-decoration', 'text-transform', 'letter-spacing',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-style', 'border-width', 'border-radius',
  'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'float', 'clear', 'visibility', 'opacity', 'overflow', 'overflow-x', 'overflow-y',
  'box-shadow', 'text-shadow', 'transform', 'transition', 'animation',
  'flex', 'flex-direction', 'justify-content', 'align-items', 'align-content',
  'grid', 'grid-template', 'grid-gap', 'gap',
  'cursor', 'pointer-events', 'user-select',
];

/**
 * Sanitize CSS content to prevent XSS attacks
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // Remove dangerous patterns
  let sanitized = css;
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* REMOVED_DANGEROUS_CONTENT */');
  }

  // Additional safety: remove any remaining script tags or HTML
  sanitized = sanitized.replace(/<[^>]*>/g, '/* REMOVED_HTML_TAG */');
  
  // Remove @import statements entirely (too risky)
  sanitized = sanitized.replace(/@import[^;]+;/gi, '/* REMOVED_IMPORT */');
  
  // Remove CSS expressions
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '/* REMOVED_EXPRESSION */');
  
  // Validate CSS properties (optional, more restrictive)
  // This is commented out as it might be too restrictive for some use cases
  // sanitized = validateCSSProperties(sanitized);

  return sanitized.trim();
}

/**
 * More restrictive CSS validation (optional)
 * Only allows whitelisted CSS properties
 */
function validateCSSProperties(css: string): string {
  const lines = css.split('\n');
  const validatedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments, empty lines, and CSS rules
    if (trimmed.startsWith('/*') || trimmed.startsWith('//') || 
        trimmed === '' || trimmed.startsWith('@') || 
        trimmed.includes('{') || trimmed.includes('}')) {
      validatedLines.push(line);
      continue;
    }

    // Check if line contains a CSS property
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const property = trimmed.substring(0, colonIndex).trim().toLowerCase();
      
      // Check if property is in whitelist
      if (ALLOWED_CSS_PROPERTIES.includes(property) || 
          property.startsWith('--')) { // Allow CSS custom properties
        validatedLines.push(line);
      } else {
        validatedLines.push(`/* REMOVED_PROPERTY: ${property} */`);
      }
    } else {
      validatedLines.push(line);
    }
  }

  return validatedLines.join('\n');
}

/**
 * Test if CSS contains potentially dangerous content
 */
export function hasDangerousCSS(css: string): boolean {
  if (!css || typeof css !== 'string') {
    return false;
  }

  return DANGEROUS_CSS_PATTERNS.some(pattern => pattern.test(css));
}
