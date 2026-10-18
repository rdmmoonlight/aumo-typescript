package com.app.mobile.contracts

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class UserContractTest {
    @Test
    fun deserializesUserContract() {
        val json = """{"id":"123","name":"Ghofur","email":"ghofur@example.com"}"""
        val user = Json.decodeFromString<UserContract>(json)
        assertEquals("Ghofur", user.name)
    }
}
