import fs from 'fs';
import path from 'path';

/**
 * Simple template renderer for HTML templates
 */
export class TemplateRenderer {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../templates');
  }

  /**
   * Render an HTML template with data
   */
  render(templateName: string, data: Record<string, any> = {}): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let template = fs.readFileSync(templatePath, 'utf-8');

    // Simple template variable replacement
    template = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      
      // Handle simple conditionals: {{#if condition}}...{{/if}}
      if (trimmedKey.startsWith('#if ')) {
        const condition = trimmedKey.substring(4);
        return data[condition] ? '' : '<!--';
      }
      
      if (trimmedKey === '/if') {
        return '-->';
      }
      
      // Handle else: {{else}}
      if (trimmedKey === 'else') {
        return '--><!--';
      }

      // Regular variable substitution
      return data[trimmedKey] || '';
    });

    // Clean up conditional comments for false conditions
    template = template.replace(/<!--[\s\S]*?-->/g, '');

    return template;
  }

  /**
   * Render email confirmation template
   */
  renderEmailConfirmation(success: boolean, message: string, redirectUrl: string): string {
    return this.render('email-confirmation', {
      success,
      message,
      redirectUrl
    });
  }

  /**
   * Render backend dashboard
   */
  renderDashboard(port: number, frontendUrl: string): string {
    return this.render('dashboard', {
      port,
      frontendUrl
    });
  }
}

// Export singleton instance
export const templateRenderer = new TemplateRenderer();

export default templateRenderer;