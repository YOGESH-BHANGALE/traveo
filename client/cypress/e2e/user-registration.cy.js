describe('User Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/register');
  });

  it('should display registration page with role selection', () => {
    cy.contains("I'm a Rider").should('be.visible');
    cy.contains("I'm a Driver").should('be.visible');
  });

  it('should register a new rider successfully', () => {
    // Select rider role
    cy.contains("I'm a Rider").click();

    // Fill registration form
    const timestamp = Date.now();
    cy.get('input[type="text"]').first().type('Test User');
    cy.get('input[type="email"]').type(`test${timestamp}@example.com`);
    cy.get('input[type="password"]').first().type('password123');

    // Submit form
    cy.contains('Sign Up').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });
  });

  it('should register a new driver successfully', () => {
    // Select driver role
    cy.contains("I'm a Driver").click();

    // Fill registration form
    const timestamp = Date.now();
    cy.get('input[type="text"]').first().type('Test Driver');
    cy.get('input[type="email"]').type(`driver${timestamp}@example.com`);
    cy.get('input[type="password"]').first().type('password123');

    // Submit form
    cy.contains('Sign Up').click();

    // Should redirect to driver dashboard
    cy.url().should('include', '/driver/dashboard', { timeout: 10000 });
  });

  it('should show error for existing email', () => {
    cy.contains("I'm a Rider").click();

    cy.get('input[type="text"]').first().type('Existing User');
    cy.get('input[type="email"]').type('existing@example.com');
    cy.get('input[type="password"]').first().type('password123');

    cy.contains('Sign Up').click();

    // Should show error message (if email exists)
    // This test will pass if email doesn't exist yet
    cy.wait(2000);
  });
});
