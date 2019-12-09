describe('sandbox', () => {
  beforeEach(() => cy.visit('/'));

  it('should display input with value "12323123123"', () => {
    cy.get('input').should('have.value', '1232 31231 23')
  });
});
