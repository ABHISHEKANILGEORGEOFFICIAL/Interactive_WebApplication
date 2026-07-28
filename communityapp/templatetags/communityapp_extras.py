from django import template

register = template.Library()

@register.filter
def get_perm(membership, key):
    field_map = {
        'post': 'can_post',
        'invite': 'can_invite',
        'pin_posts': 'can_pin_posts',
        'announce': 'can_create_announcements',
    }
    field = field_map.get(key)
    if field:
        return getattr(membership, field, False)
    return False
