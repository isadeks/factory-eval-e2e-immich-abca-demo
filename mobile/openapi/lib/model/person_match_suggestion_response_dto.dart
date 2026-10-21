//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonMatchSuggestionResponseDto {
  /// Returns a new [PersonMatchSuggestionResponseDto] instance.
  PersonMatchSuggestionResponseDto({
    required this.distance,
    required this.id,
    required this.person,
    required this.suggestedPerson,
  });

  /// Face embedding distance between the two people (lower is more similar)
  num distance;

  /// Suggestion ID
  String id;

  PersonResponseDto person;

  PersonResponseDto suggestedPerson;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonMatchSuggestionResponseDto &&
    other.distance == distance &&
    other.id == id &&
    other.person == person &&
    other.suggestedPerson == suggestedPerson;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (distance.hashCode) +
    (id.hashCode) +
    (person.hashCode) +
    (suggestedPerson.hashCode);

  @override
  String toString() => 'PersonMatchSuggestionResponseDto[distance=$distance, id=$id, person=$person, suggestedPerson=$suggestedPerson]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'distance'] = this.distance;
      json[r'id'] = this.id;
      json[r'person'] = this.person;
      json[r'suggestedPerson'] = this.suggestedPerson;
    return json;
  }

  /// Returns a new [PersonMatchSuggestionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonMatchSuggestionResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonMatchSuggestionResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonMatchSuggestionResponseDto(
        distance: num.parse('${json[r'distance']}'),
        id: mapValueOfType<String>(json, r'id')!,
        person: PersonResponseDto.fromJson(json[r'person'])!,
        suggestedPerson: PersonResponseDto.fromJson(json[r'suggestedPerson'])!,
      );
    }
    return null;
  }

  static List<PersonMatchSuggestionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonMatchSuggestionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonMatchSuggestionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonMatchSuggestionResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonMatchSuggestionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonMatchSuggestionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonMatchSuggestionResponseDto-objects as value to a dart map
  static Map<String, List<PersonMatchSuggestionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonMatchSuggestionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonMatchSuggestionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'distance',
    'id',
    'person',
    'suggestedPerson',
  };
}

