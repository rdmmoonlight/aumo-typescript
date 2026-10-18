use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct UserContract {
    pub id: String,
    pub name: String,
    pub email: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_contract_serialization() {
        let user = UserContract {
            id: "123e4567-e89b-12d3-a456-426614174000".to_string(),
            name: "Ghofur".to_string(),
            email: "ghofur@example.com".to_string(),
        };

        let json = serde_json::to_string(&user).unwrap();
        assert!(json.contains("email"));
    }
}
