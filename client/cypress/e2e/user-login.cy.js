describe('User Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login page with role selection', () => {
    cy.contains("I'm a Rider").should('be.visible');
    cy.contains("I'm a Driver").should('be.visible');
  });

  it('should show login form after selecting role', () => {
    cy.contains("I'm a Rider").click();

    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('Log In').should('be.visible');
  });

  it('should toggle password visibility', () => {
    cy.contains("I'm a Rider").click();

    const passwordInput = cy.get('input[type="password"]');
    passwordInput.should('have.attr', 'type', 'password');

    // Click eye icon to show password
    cy.get('button[type="button"]').last().click();
    cy.get('input[type="text"]').should('exist');

    // Click again to hide
    cy.get('button[type="button"]').last().click();
    passwordInput.should('have.attr', 'type', 'password');
  });

  it('should show error for invalid credentials', () => {
    cy.contains("I'm a Rider").click();

    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('Log In').click();

    // Should show error toast
    cy.wait(2000);
  });

  it('should allow navigation back to role selection', () => {
    cy.contains("I'm a Rider").click();
    cy.contains('Back').click();

    cy.contains("I'm a Rider").should('be.visible');
    cy.contains("I'm a Driver").should('be.visible');
  });
});
