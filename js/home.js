$(document).ready(function () {

    resetTransaction();
    loadItems();
    purchaseItem();
    collectChange();

})

/**
 * Loads and displays the vending machine items' info from 
 * the server.
 */
function loadItems() {
    // reset the display
    $('#items-table tbody').empty();

    $.ajax({
        type: 'GET',
        url: 'http://vending.us-east-1.elasticbeanstalk.com/items',
        success: function (items) {
            var content = "<tr>";

            $(items).each(function (index) {
                var id = this.id;
                var name = this.name;
                var price = this.price;
                var quantity = this.quantity;

                if (index % 3 == 0) {
                    content += "</tr>";
                    if (index != items.length) {
                        content += "<tr>";
                    }
                }

                var disabledStatus = "";
                var ariaDisabledStatus = "false";
                if (quantity == 0) {
                    disabledStatus = "disabled";
                    ariaDisabledStatus = "true";
                }

                var btnInputId = "item-btn-" + id.toString();

                content += "<td class='vending-item container p-0'>";
                content += "<a href='#' id='" + btnInputId + "' class='btn btn-secondary item-btn "
                            + disabledStatus + "' role='button' aria-disabled='" 
                            + ariaDisabledStatus + "'" + " onclick='selectItem(" + id + ")'>";
                content += "<label for='" + btnInputId 
                            + "' class='item-btn-label d-flex flex-column py-1'>";
                content += "<span class='item-index pe-1 align-self-start'>" + id + "</span>";
                content += "<span class='item-name text-center pb-1'>" + name + "</span>";
                content += "<span class='item-price text-center'>" + "$" 
                            + formatPrice(price) + "</span>";
                content += "<span class='item-quantity text-center pt-2'>" + "In Stock: " 
                            + quantity + "</span>";
                content += "</label></a>";
                content += "</td>";
            })

            $('#items-table tbody').append(content);
        },
        error: function () {
            $('#messages-readonly').addClass('is-invalid');
            $('#messages-readonly').val("Error calling web service! ");
        }
    })
}

/**
 * Displays the id of the selected item in the item text-input.
 * @param {*} id 
 */
function selectItem(id) {
    $('#messages-readonly').val("");
    $('#item-name-readonly').val(id);
}

/**
 * Adds the input money value to the current total-input value.
 * @param {*} moneyValue 
 */
function insertMoney(moneyValue) {
    var currentTotal = $('#total-input').val().replace("$", "").replace(".", "");
    currentTotal = BigInt(currentTotal);
    moneyValue = BigInt(moneyValue);

    var newTotal = (currentTotal + moneyValue).toString();
    newTotal = convertBigIntToCurrency(newTotal);
    $('#total-input').val(newTotal);
}

/**
 * Sends a POST request to vending machine web service to purchase
 * the selected item and updates the UI in success and error.
 */
function purchaseItem() {
    $('#purchase-btn').click(function () {
        clearMessages();
        var moneyInput = $('#total-input').val().replace("$", "");
        var itemId = $('#item-name-readonly').val();

        $.ajax({
            type: 'POST',
            url: 'http://vending.us-east-1.elasticbeanstalk.com/money/' 
                        + moneyInput + '/item/' + itemId,
            statusCode: {
                422: function (jqXHR, textStatus, errorThrown) {
                    $('#messages-readonly').addClass('is-invalid');
                    var jsonResponse = jqXHR.responseJSON.message;
                    //var response = textStatus + ": " + jqXHR.status + " " + jsonResponse;
                    $('#messages-readonly').val(jsonResponse);
                }
            },
            success: function (change) {
                var totalChange = calculateTotalChange(change);
                $('#collect-change-readonly').val(totalChange);
                $('#total-input').val("$0.00")
                $('#messages-readonly').val("Thank you for purchasing #" + itemId + "!");
                $('#item-name-readonly').val("");
                loadItems();

            },
            error: function (jqXHR, textStatus, errorThrown) {
                $('#messages-readonly').addClass('is-invalid');
                $('#messages-readonly').val("error calling web service");
            }
        })
    })
}

/**
 * Resets the transaction and reloads the items.
 */
function collectChange() {
    $('#collect-change-btn').click(function () {
        resetTransaction();
        loadItems();
    })
}

/**
 * Calculates the sum of change from JSON data.
 * @param {*} change 
 * @returns 
 */
function calculateTotalChange(change) {
    var quarters = change.quarters;
    var dimes = change.dimes;
    var nickels = change.nickels;
    var pennies = change.pennies;

    var totalChange = BigInt(25 * quarters) + BigInt(10 * dimes)
        + BigInt(5 * nickels) + BigInt(pennies);

    var currentChange = BigInt($('#collect-change-readonly').val()
        .replace("$", "").replace(".",""));
    if (currentChange > 0) {
        totalChange = BigInt(totalChange) + BigInt(currentChange);
    }

    return convertBigIntToCurrency(totalChange);
}

/**
 * Clears and resets the messages text-input.
 */
function clearMessages() {
    $('#messages-readonly').removeClass('is-invalid');
    $('#messages-readonly').val("");
}

/**
 * Resets the components of the transaction side (input value, 
 * messages display, item selection, and change available to collect).
 */
function resetTransaction() {
    $('#total-input').val("$0.00");
    clearMessages();
    $('#item-name-readonly').val("");
    $('#collect-change-readonly').val("");
}

/**
 * Converts a penny value (100 cents / 1 dollar) to a dollar value, 
 * adding '$' and decimal with leading and trailing zeros.
 * @param {*} value 
 * @returns 
 */
function convertBigIntToCurrency(value) {
    var newMoney = value.toString();

    if (newMoney.length <= 2) {
        if (newMoney.length == 1) {
            newMoney = "$0.0" + newMoney;
        } else {
            newMoney = "$0." + newMoney;
        }
    } else {
        newMoney = "$" + newMoney.slice(0, -2) + "." 
            + newMoney.slice(-2);
    }

    return newMoney;
}

/**
 * Formats the price in the items table to contain a 
 * decimal and trailing zeros.
 * @param {} price 
 * @returns 
 */
function formatPrice(price) {
    var decimalIndex = price.toString().indexOf('.');

    if (decimalIndex < 0) {
        price += ".00";
        return price;
    }

    if ((decimalIndex + 3) != price.toString().length) {
        price += "0";
    }

    return price;
}