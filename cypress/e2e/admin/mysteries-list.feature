Feature: Admin Mystery List
  As an admin
  I want to view and manage mysteries
  So that I can maintain the game content

  @mocked
  Scenario: Admin sees list of mysteries
    Given I mock the mysteries API with sample data
    When I visit the admin mysteries page
    Then I should see the mysteries table
    And I should see at least 1 mystery in the list

  @mocked
  Scenario: Admin can navigate to create new mystery
    Given I mock the mysteries API with sample data
    And I visit the admin mysteries page
    When I click the new mystery button
    Then I should be on the new mystery edit page

  @mocked
  Scenario: Admin can navigate to upload mysteries
    Given I mock the mysteries API with sample data
    And I visit the admin mysteries page
    When I click the upload button
    Then I should be on the upload mysteries page

  @mocked
  Scenario: Admin can delete a mystery
    Given I mock the mysteries API with sample data
    And I mock the delete mystery API
    And I visit the admin mysteries page
    When I click the delete button for the first mystery
    Then I should see the delete confirmation dialog
    When I confirm the deletion
    Then the mystery should be removed from the list

  @mocked
  Scenario: Admin can cancel mystery deletion
    Given I mock the mysteries API with sample data
    And I visit the admin mysteries page
    When I click the delete button for the first mystery
    And I click cancel on the delete dialog
    Then the delete dialog should close
    And the mystery should still be in the list

  @mocked
  Scenario: Empty state when no mysteries exist
    Given I mock the mysteries API with empty data
    When I visit the admin mysteries page
    Then I should see the empty state message
    And I should see a create mystery button
