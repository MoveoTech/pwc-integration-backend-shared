"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = {
    queryItemColumnsValues: `query($itemId: [Int]) {
        items(ids: $itemId) {
            id
            name
            parent_item{
                id
            }
            column_values {
                id
                text
            }
        }
    }
  `,
    getItemsColumnValuesByBoardId: `query ($boardId: [Int]!, $page: Int!, $limit: Int!){
    boards (ids: $boardId, page: $page, limit: $limit) {
      items {
        id
        name
        column_values {
          id
          text
        }
      }
    }
  }`,
    queryItemsByColumnValue: `query($boardId: Int!, $columnId: String!, $columnValue: String!, $page: Int!, $limit: Int!) {
        items_by_column_values(board_id: $boardId, column_id: $columnId, column_value: $columnValue, page: $page, limit: $limit) {
            id
            name
            parent_item{
                id
            }
            column_values {
                id
                text
            }
        }
    }
  `,
    querySubItems: `query($itemId: [Int]) {
        items(ids: $itemId) {
            subitems{
                id
                name
                parent_item{
                    id
                }
                column_values {
                    id
                    text
                }
            }
        }
    }
  `,
    changeItemColumnValue: `mutation($boardId: Int!, $itemId: Int!, $columnValues: JSON!) {
        change_multiple_column_values (board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
            id
        }
    }
  `,
    createItem: `mutation($boardId: Int!, $itemName: String!, $columnValues: JSON) {
        create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
            id
        }
        complexity {before reset_in_x_seconds}
    }
  `,
    createNotification: `mutation($text: String!, $userId: Int!, $targetId: Int!) {
        create_notification (user_id: $userId, target_id: $targetId, text: $text, target_type: Project) {
            text
        }
    }
  `,
    getUserId: `query ($name: String){
      users (name: $name) {
        id
      }
    }
  `,
};
//# sourceMappingURL=monday-queries.js.map