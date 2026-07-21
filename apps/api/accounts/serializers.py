from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "created_at"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, min_length=6)
    new_password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ["name", "current_password", "new_password"]

    def validate(self, data):
        if "new_password" in data:
            if "current_password" not in data:
                raise serializers.ValidationError({"current_password": "Required to set a new password."})
            if not self.instance.check_password(data["current_password"]):
                raise serializers.ValidationError({"current_password": "Incorrect password."})
        return data

    def update(self, instance, validated_data):
        validated_data.pop("current_password", None)
        new_password = validated_data.pop("new_password", None)
        if "name" in validated_data:
            instance.name = validated_data["name"]
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance
