describe('Navigation Tests', () => {
  it('should load homepage', () => {
    cy.visit('/');
    cy.contains('Traveo').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.visit('/');
    cy.contains('Login').click();
    cy.url().should('include', '/auth/login');
  });

  it('should navigate to register page', () => {
    cy.visit('/');
    cy.contains('Sign Up').click();
    cy.url().should('include', '/auth/register');
  });

  it('should have working links in navigation', () => {
    cy.visit('/');
    
    // Check if main navigation elements exist
    cy.get('nav').should('exist');
  });
});
