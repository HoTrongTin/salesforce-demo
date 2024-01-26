trigger AccountUpdateTrigger on Account (before update) {
    // List to store accounts that need to be updated
    List<Account> accountsToUpdate = new List<Account>();
    for (Integer i = 0; i < Trigger.new.size(); i++) {
        Account newAccount = Trigger.new[i];
        Account oldAccount = Trigger.old[i];

        // If the account is not being updated, skip it
        if (AccountHelper.fieldsAreEqual(newAccount, oldAccount)) {
            continue;
        }

        // Increment the Update Count field
        newAccount.Update_Count__c = (newAccount.Update_Count__c != null) ? newAccount.Update_Count__c + 1 : 1;

        // Add the account to the list
        accountsToUpdate.add(newAccount);
    }
}