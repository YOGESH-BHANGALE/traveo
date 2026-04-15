// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email, password, role = 'user') => {
  cy.visit('/auth/login');
  
  if (role === 'driver') {
    cy.contains("I'm a Driver").click();
  } else {
    cy.contains("I'm a Rider").click();
  }
  
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.contains('Log In').click();
  
  cy.wait(2000);
});

// Custom command to register
Cypress.Commands.add('register', (name, email, password, role = 'user') => {
  cy.visit('/auth/register');
  
  if (role === 'driver') {
    cy.contains("I'm a Driver").click();
  } else {
    cy.contains("I'm a Rider").click();
  }
  
  cy.get('input[type="text"]').first().type(name);
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').first().type(password);
  cy.contains('Sign Up').click();
  
  cy.wait(2000);
});
