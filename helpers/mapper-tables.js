const {
    DYNAMODB_PROGRAM_TABLE,
    DYNAMODB_USERS_TABLE,
    PRG_TABLE_ID,
    USR_TABLE_ID,
    PER_TABLE_ID
} = process.env;

export const MAP_TABLE_NAME = {
    prg: {
        tableName: DYNAMODB_PROGRAM_TABLE,
        id: PRG_TABLE_ID
    },
    usr: {
        tableName: DYNAMODB_USERS_TABLE,
        id: USR_TABLE_ID
    },
    per: {
        tableName: DYNAMODB_USERS_TABLE,
        id: PER_TABLE_ID
    }
}