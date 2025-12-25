Feature: Admin Console Access
  As a game administrator
  I want to access the admin console from the homepage
  So that I can manage mysteries

  Background:
    Given I am on the homepage

  Scenario: Access admin console via settings icon
    When I click the settings icon
    Then I should be on the admin mysteries page
    And I should see the page title "Mysteries"
