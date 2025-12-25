Feature: Upload Mysteries
  As an admin
  I want to upload mysteries via JSON or ZIP
  So that I can add new game content in bulk

  @mocked
  Scenario: Admin sees upload page with both options
    When I visit the upload mysteries page
    Then I should see the ZIP upload section
    And I should see the JSON input section

  @mocked
  Scenario: Admin can upload valid JSON mystery
    Given I mock the bulk create API for success
    And I visit the upload mysteries page
    When I paste valid mystery JSON in the input
    And I click the upload JSON button
    Then I should see a success message

  @mocked
  Scenario: Admin sees validation error for invalid JSON
    Given I visit the upload mysteries page
    When I paste invalid JSON in the input
    And I click the upload JSON button
    Then I should see an error message

  @mocked
  Scenario: Admin can select a ZIP file
    Given I visit the upload mysteries page
    When I select a ZIP file for upload
    Then I should see the selected file name

  @mocked
  Scenario: Upload button is disabled without input
    When I visit the upload mysteries page
    Then the JSON upload button should be disabled
    And the ZIP upload button should be disabled
