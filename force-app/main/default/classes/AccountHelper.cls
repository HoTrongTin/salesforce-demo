public class AccountHelper {
    public static Boolean fieldsAreEqual(Account newAccount, Account oldAccount) {
        for (SObjectField field : Account.SObjectType.getDescribe().fields.getMap().values()) {
            String fieldName = String.valueOf(field);
            
            // Does not check for null values
            if (newAccount.get(fieldName) == null) {
                continue;
            }

            if (newAccount.get(fieldName) != oldAccount.get(fieldName)) {
                return false;
            }
        }
        return true;
    }
}