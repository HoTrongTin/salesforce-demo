import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

const columns = [
  { label: 'Account Name', fieldName: 'Name', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
  { label: 'Owner', fieldName: 'OwnerId', type: 'url', typeAttributes: { label: { fieldName: 'OwnerName' }, target: '_blank' } },
  { label: 'Account Phone Number', fieldName: 'Phone', type: 'phone' },
  { label: 'Account Revenue', fieldName: 'AnnualRevenue', type: 'currency', currencyCode: 'USD' },
  { label: 'Last Modified Date', fieldName: 'LastModifiedDate', type: 'date-local' }
];

export default class AccountConsole extends LightningElement {
  @track accountData = [];
  @track columns = columns;
  @track currentPage = 1;
  @track totalPages = 1;
  @track recordsPerPageOptions = [{ label: '10', value: 10 }, { label: '20', value: 20 }, { label: '30', value: 30 }];
  @track recordsPerPage = 10;
  @track disablePrevious = true;
  @track disableNext = false;

  @wire(getAccounts)
  wiredAccounts({ error, data }) {
    if (data) {
      this.accountData = data.accounts;
      this.totalPages = Math.ceil(data.totalRecords / this.recordsPerPage);
      this.disablePrevious = this.currentPage === 1;
      this.disableNext = this.currentPage === this.totalPages;
    } else if (error) {
      console.error(error);
    }
  }

  handlePrevious() {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  handleNext() {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  handleRecordsPerPageChange(event) {
    this.recordsPerPage = event.detail.value;
    this.currentPage = 1;
  }

  // use lifecycle hook
  connectedCallback() {
    console.log('******************** ConnectedCallback...');
  }
}
