function showTriplet(showAccount) {
    console.log(`Steem account: ${showAccount.account}`);
    console.log(`Last activity: ${formatDate(showAccount.activityTime)}`);
    console.log(`Last display: ${formatDate(showAccount.lastDisplayTime)}`);
}

function formatDate(dateInput) {
    if (dateInput instanceof Date) {
        return dateInput.toISOString();
    } else if (typeof dateInput === 'string') {
        try {
            return new Date(dateInput).toISOString();
        } catch (e) {
            return `Invalid date (${dateInput})`;
        }
    } else {
        return `Unsupported date format (${dateInput})`;
    }
}

function isEmptyActivityList(activities) {
    const { postList, commentList, replyList } = activities;
    
    return (!postList || postList.length === 0) &&
           (!commentList || commentList.length === 0) &&
           (!replyList || replyList.length === 0);
}

function getLastActivityTimeFromAll(activities) {
    const { postList, commentList, replyList } = activities;
    let lastActivity = new Date("1970-01-01T00:00:00Z");

    function updateLastActivity(items) {
        for (const item of items) {
            const itemTime = new Date(`${item[1].timestamp}Z`);
            lastActivity = newerDate(lastActivity, itemTime);
        }
    }

    updateLastActivity(postList);
    updateLastActivity(commentList);
    updateLastActivity(replyList);

    return lastActivity;
}

function updateLastDisplayTime(accountsList, accountToUpdate, activityTime ) {
    const activityTimeStr = new Date (`${activityTime}`).toISOString();
    return accountsList.map(item => {
      if (item.account === accountToUpdate) {
        // console.debug(`Account: ${accountToUpdate}, display time: ${item.lastDisplayTime}, activity time: ${item.activityTime}`);
        return {
          account: accountToUpdate,
          lastDisplayTime: activityTimeStr,
          activityTime: activityTimeStr
        };
      }
      return item;
    });
  }

  // Function to retrieve stored accountsWithNewActivity from chrome.storage.local
async function getStoredAccountsWithNewActivity() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('accountsWithNewActivity', function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.accountsWithNewActivity);
            }
        });
    });
}

// Function to save stored accountsWithNewActivity in chrome.storage.local
async function saveStoredAccountsWithNewActivity(uniqueAccountsWithNewActivity) {
    return new Promise((resolve, reject) => {
        console.log("Inside: saveStoredAccountsWithNewActivity");
        chrome.storage.local.set({ 'accountsWithNewActivity': JSON.stringify(uniqueAccountsWithNewActivity) }, function () {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

function newerDate(date1, date2) {
    return new Date(date1) > new Date(date2) ? date1 : date2;
}

/*
 * Remove duplicates using a Set and convert back to an Array
 */
function filterUniqueAccounts(accountsWithNewActivity) {
    const parsedAccounts = JSON.parse(accountsWithNewActivity);
    
    const uniqueAccounts = parsedAccounts.reduce((acc, item) => {
        if (!acc[item.account]) {
            acc[item.account] = item;
        } else {
            acc[item.account].activityTime = newerDate(acc[item.account].activityTime, item.activityTime);
            acc[item.account].lastDisplayTime = newerDate(acc[item.account].lastDisplayTime, item.lastDisplayTime);
        }
        return acc;
    }, {});

    return Object.values(uniqueAccounts);
}