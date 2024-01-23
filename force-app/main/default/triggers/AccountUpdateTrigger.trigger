trigger AccountUpdateTrigger on Account (before update) {
    // List to store accounts that need to be updated
    List<Account> accountsToUpdate = new List<Account>();

    for (Account newAccount : Trigger.new) {

        // Check if any field has been updated
            // Increment the Update Count field
            newAccount.Update_Count__c = (newAccount.Update_Count__c != null) ? newAccount.Update_Count__c + 1 : 1;

            // Add the account to the list
            accountsToUpdate.add(newAccount);
    }

    }